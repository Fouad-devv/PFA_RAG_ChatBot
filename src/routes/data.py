import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from fastapi.responses import JSONResponse
from auth import require_roles
from controllers import ProcessController
from models import ResponseSignal
from models.ChunkModel import ChunkModel
from models.AssetModel import AssetModel
from models.db_schemes import DataChunk, Asset
from models.enums.AssetTypeEnum import AssetTypeEnum
from .schemes.data import ProcessRequest

logger = logging.getLogger("uvicorn.error")

data_router = APIRouter(
    prefix="/api/v1/data",
    tags=["api_v1", "data"],
)

ALLOWED_FILE_EXTENSIONS = {".pdf", ".txt"}


def _sanitize_file_name(file_name: Optional[str]) -> Optional[str]:
    if not file_name:
        return None
    clean_name = Path(file_name).name.strip()
    if not clean_name:
        return None
    return clean_name


def _is_supported_file(file_name: str) -> bool:
    extension = os.path.splitext(file_name)[1].lower()
    return extension in ALLOWED_FILE_EXTENSIONS


@data_router.get("/files", dependencies=[Depends(require_roles("admin"))])
async def list_source_files():
    process_controller = ProcessController()
    source_files = process_controller.list_source_files()

    items = []
    for file_name in source_files:
        file_path = os.path.join(process_controller.source_dir, file_name)
        try:
            stats = os.stat(file_path)
        except OSError:
            continue

        items.append(
            {
                "name": file_name,
                "size_bytes": stats.st_size,
                "updated_at": datetime.fromtimestamp(
                    stats.st_mtime, tz=timezone.utc
                ).isoformat(),
                "extension": os.path.splitext(file_name)[1].lower(),
            }
        )

    items.sort(key=lambda item: item["updated_at"], reverse=True)

    return JSONResponse(
        content={
            "signal": ResponseSignal.FILES_LISTED.value,
            "files": items,
            "supported_extensions": sorted(ALLOWED_FILE_EXTENSIONS),
        }
    )


@data_router.post("/upload", dependencies=[Depends(require_roles("admin"))])
async def upload_source_files(files: List[UploadFile] = File(...)):
    process_controller = ProcessController()
    os.makedirs(process_controller.source_dir, exist_ok=True)

    uploaded_files = []
    rejected_files = []

    for file in files:
        file_name = _sanitize_file_name(file.filename)
        if file_name is None:
            rejected_files.append(
                {
                    "name": file.filename or "",
                    "reason": "invalid_file_name",
                }
            )
            await file.close()
            continue

        if not _is_supported_file(file_name):
            rejected_files.append(
                {
                    "name": file_name,
                    "reason": "unsupported_extension",
                }
            )
            await file.close()
            continue

        destination_path = os.path.join(process_controller.source_dir, file_name)
        try:
            content = await file.read()
            with open(destination_path, "wb") as destination:
                destination.write(content)
        except OSError as exc:
            logger.error("Failed to save uploaded file %s: %s", file_name, exc)
            rejected_files.append(
                {
                    "name": file_name,
                    "reason": "save_failed",
                }
            )
        else:
            uploaded_files.append(
                {
                    "name": file_name,
                    "size_bytes": len(content),
                }
            )
        finally:
            await file.close()

    status_code = status.HTTP_200_OK
    if len(uploaded_files) == 0:
        status_code = status.HTTP_400_BAD_REQUEST

    return JSONResponse(
        status_code=status_code,
        content={
            "signal": ResponseSignal.FILES_UPLOADED.value,
            "uploaded_count": len(uploaded_files),
            "rejected_count": len(rejected_files),
            "uploaded_files": uploaded_files,
            "rejected_files": rejected_files,
        },
    )


@data_router.post("/process", dependencies=[Depends(require_roles("admin"))])
async def process_endpoint(request: Request, process_request: ProcessRequest):

    chunk_size = process_request.chunk_size
    overlap_size = process_request.overlap_size
    do_reset = process_request.do_reset

    asset_model = await AssetModel.create_instance(db_client=request.app.db_client)
    chunk_model = await ChunkModel.create_instance(db_client=request.app.db_client)
    process_controller = ProcessController()

    disk_file_names = process_controller.list_source_files()
    if len(disk_file_names) == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": ResponseSignal.NO_FILES_ERROR.value},
        )

    # sync disk files with asset records
    for file_name in disk_file_names:
        file_size = process_controller.get_file_size(file_id=file_name)
        existing = await asset_model.get_asset_record(asset_name=file_name)
        if existing is None:
            await asset_model.create_asset(asset=Asset(
                asset_type=AssetTypeEnum.FILE.value,
                asset_name=file_name,
                asset_size=file_size,
            ))
        elif existing.asset_size != file_size:
            await asset_model.update_asset_size(
                asset_name=file_name,
                asset_size=file_size,
            )

    assets = await asset_model.get_all_assets(asset_type=AssetTypeEnum.FILE.value)
    asset_by_name = {a.asset_name: a for a in assets}

    if do_reset == 1:
        await chunk_model.delete_all_chunks()

    no_records = 0
    no_files = 0
    for file_name in disk_file_names:
        asset = asset_by_name.get(file_name)
        if asset is None:
            continue

        file_content = process_controller.get_file_content(file_id=file_name)
        if file_content is None:
            logger.error(f"Error while processing file: {file_name}")
            continue

        file_chunks = process_controller.process_file_content(
            file_content=file_content,
            file_id=file_name,
            chunk_size=chunk_size,
            overlap_size=overlap_size,
        )

        if not file_chunks:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"signal": ResponseSignal.PROCESSING_FAILED.value},
            )

        chunk_records = [
            DataChunk(
                chunk_text=chunk.page_content,
                chunk_metadata=chunk.metadata,
                chunk_order=i + 1,
                chunk_asset_id=asset.id,
            )
            for i, chunk in enumerate(file_chunks)
        ]

        no_records += await chunk_model.insert_many_chunks(chunks=chunk_records)
        no_files += 1

    return JSONResponse(
        content={
            "signal": ResponseSignal.PROCESSING_SUCCESS.value,
            "inserted_chunks": no_records,
            "processed_files": no_files,
        }
    )
