from .BaseDataModel import BaseDataModel
from .db_schemes import Asset
from .enums.DataBaseEnum import DataBaseEnum


class AssetModel(BaseDataModel):

    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_ASSET_NAME.value]

    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_ASSET_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_ASSET_NAME.value]
            for index in Asset.get_indexes():
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"],
                )

    async def create_asset(self, asset: Asset) -> Asset:
        result = await self.collection.insert_one(
            asset.model_dump(by_alias=True, exclude_none=True)
        )
        asset.id = result.inserted_id
        return asset

    async def get_all_assets(self, asset_type: str):
        records = await self.collection.find(
            {"asset_type": asset_type}
        ).to_list(length=None)
        return [Asset(**record) for record in records]

    async def get_asset_record(self, asset_name: str):
        record = await self.collection.find_one({"asset_name": asset_name})
        if record:
            return Asset(**record)
        return None

    async def update_asset_size(self, asset_name: str, asset_size: int):
        await self.collection.update_one(
            {"asset_name": asset_name},
            {"$set": {"asset_size": asset_size}},
        )
