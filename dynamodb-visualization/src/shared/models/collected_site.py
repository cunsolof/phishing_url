from boto3.dynamodb.types import TypeSerializer
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import List
import uuid


class SourceType(Enum):
    API = "API"
    CRAWLER = "CRAWLER"
    HONEY_POT = "HONEY_POT"
    MAIL = "MAIL"


@dataclass
class CollectedSite:
    """
    The purpose of this class is to represent a link resulting from any source.

    **Mandatory attributs are the following:**
    - `id` should be a uuid format (ex: `550e8400-e29b-41d4-a716-446655440000`)
    - `date` should be in `YYYY-MM-DD` in order to be easly sorted.
    - `source` should be a value among `API`, `CRAWLER`, `HONEY_POT` or `MAIL` (use `SourceType` enum type)
    - `url` refers to the corresponding url.

    *Optional attributs are described below:*
    - `screenshot` should be a `s3 uri` refering to a screenshot of the corresponding website.
    - `is_safe` is a `boolean` indicating if the corresponding website is considered as a phishing page.
    """

    @staticmethod
    def source_type_from_string(value: str) -> SourceType:
        match value:
            case "API":
                return SourceType.API
            case "CRAWLER":
                return SourceType.CRAWLER
            case "HONEY_POT":
                return SourceType.HONEY_POT
            case "MAIL":
                return SourceType.MAIL
            case _:
                raise Exception("Invalid SourceType.")

    @staticmethod
    def from_urls(
        urls: List[str], source: SourceType, source_name: str = None
    ) -> List[object]:
        res = []
        for url in urls:
            res.append(
                CollectedSite(
                    id=uuid.uuid4(),
                    date=datetime.today().strftime("%Y-%m-%dT%H:%M:%S"),
                    source=source,
                    source_name=source_name,
                    url=url,
                    screenshot=None,
                    is_safe=None,
                )
            )
        return res

    @staticmethod
    def from_dynamodb_item(item: object) -> object:
        res = CollectedSite(
            item['id']['S'],
            item['date']['S'],
            CollectedSite.source_type_from_string(item['source']['S']),
            None,
            item['url']['S'],
            None,
            None
        )

        if 'source_name' in item.keys():
            res.source_name = item['source_name']['S']
        if 'screenshot' in item.keys():
            res.screenshot = item['screenshot']['S']
        if 'is_safe' in item.keys():
            res.is_safe = item['is_safe']['BOOL']

        return res

    def to_dynamodb_item(self) -> dict:
        """
        Converts the `CollectedSite` object in a dict in order to be inserted into `DynamoDB`.

        Every attributes with `None` value will be excluded from the result.
        """
        item = asdict(self)
        item = {k: v for k, v in item.items() if v is not None}

        item["id"] = str(self.id)
        item["source"] = self.source.value

        serializer = TypeSerializer()
        dynamodb_item = {k: serializer.serialize(v) for k, v in item.items()}

        return dynamodb_item

    # Mandatory
    id: str
    date: str
    source: SourceType
    source_name: str
    url: str

    # Optional
    screenshot: str
    is_safe: bool
