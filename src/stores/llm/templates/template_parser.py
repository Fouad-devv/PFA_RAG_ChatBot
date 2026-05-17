import os
import importlib
from string import Template
from typing import Any, Optional


class TemplateParser:
    """Resolves prompt strings from `locales/<lang>/<group>.py` modules.

    Each locale module exposes module-level `string.Template` attributes
    (e.g. `system_prompt`, `document_prompt`). `get(group, key, vars)`
    loads the module for the active language, falls back to the default
    language if the file or key is missing, and substitutes `vars`.
    """

    LOCALES_PACKAGE = "stores.llm.templates.locales"

    def __init__(self, language: str = "en", default_language: str = "en"):
        self.default_language = default_language
        self.language = self._resolve_language(language) or default_language

    def _locales_dir(self) -> str:
        return os.path.join(os.path.dirname(__file__), "locales")

    def _resolve_language(self, language: Optional[str]) -> Optional[str]:
        if not language:
            return None
        lang_dir = os.path.join(self._locales_dir(), language)
        return language if os.path.isdir(lang_dir) else None

    def set_language(self, language: str) -> None:
        self.language = self._resolve_language(language) or self.default_language

    def _load_group(self, language: str, group: str):
        try:
            return importlib.import_module(f"{self.LOCALES_PACKAGE}.{language}.{group}")
        except ModuleNotFoundError:
            return None

    def get(self, group: str, key: str, vars: Optional[dict] = None) -> str:
        module = self._load_group(self.language, group)
        template = getattr(module, key, None) if module else None

        if template is None and self.language != self.default_language:
            module = self._load_group(self.default_language, group)
            template = getattr(module, key, None) if module else None

        if template is None:
            raise KeyError(f"Template '{key}' not found in group '{group}'")

        if not isinstance(template, Template):
            template = Template(str(template))

        return template.safe_substitute(vars or {})
