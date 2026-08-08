class GoogleSectionImporter:

    @staticmethod
    def extract(item: dict):

        if "pageBreakItem" in item:

            return {
                "is_section": True,
                "title": item.get(
                    "title"
                ),
                "description": item.get(
                    "description"
                ),
            }

        return {
            "is_section": False
        }