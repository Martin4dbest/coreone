class GoogleMediaImporter:

    @staticmethod
    def extract(item: dict):

        media = {
            "image": None,
            "video": None,
        }

        question = item.get(
            "questionItem",
            {}
        )

        if "image" in question:

            media["image"] = question[
                "image"
            ].get(
                "contentUri"
            )

        if "videoItem" in item:

            media["video"] = item[
                "videoItem"
            ].get(
                "youtubeUri"
            )

        return media