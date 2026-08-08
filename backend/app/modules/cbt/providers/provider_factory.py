from app.modules.cbt.providers.google_forms import (
    GoogleFormsProvider,
)


class ProviderFactory:

    providers = {

        "google_forms": GoogleFormsProvider,

    }

    @classmethod
    def get(
        cls,
        provider,
    ):

        if provider not in cls.providers:
            raise Exception(
                f"{provider} not supported."
            )

        return cls.providers[
            provider
        ]()