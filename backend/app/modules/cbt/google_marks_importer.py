class GoogleMarksImporter:

    @staticmethod
    def extract(item: dict) -> int:

        grading = (
            item.get("questionItem", {})
                .get("grading", {})
        )

        points = grading.get(
            "pointValue"
        )

        if points is None:
            return 1

        return int(points)