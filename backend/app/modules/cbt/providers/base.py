from abc import ABC
from abc import abstractmethod


class BaseCBTProvider(ABC):

    @abstractmethod
    async def create_exam(
        self,
        exam,
    ):
        ...

    @abstractmethod
    async def import_exam(
        self,
        external_id,
    ):
        ...

    @abstractmethod
    async def sync_results(
        self,
        exam_id,
    ):
        ...

    @abstractmethod
    async def delete_exam(
        self,
        exam_id,
    ):
        ...
