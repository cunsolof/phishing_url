from boto3 import client
from os import environ
from src.shared.models.collected_site import CollectedSite


class DynamoDbAccessor:
    """
    The purpose of this class is to interact easly with AWS DynamoDB.
    """

    def __init__(self):
        self.client = client("dynamodb")
        self.__TABLE_NAME = environ["TABLE_NAME"]

    def read_collected_site(self, id: str) -> CollectedSite:
        """
        Reads the CollectedSite object with the specified id from the database.
        """
        response = self.client.get_item(
            TableName=self.__TABLE_NAME, Key={"id": {"S": id}, "date": {"S": "YYYY-MM-DDThh:mm:ss"}}
        )
        return CollectedSite.from_dynamodb_item(response['Item'])

    def write(self, collected_site: CollectedSite) -> None:
        """
        Creates or updates an item from the provided CollectedSite object in the database.
        """
        self.client.put_item(
            TableName=self.__TABLE_NAME,
            Item=CollectedSite.to_dynamodb_item(collected_site),
        )

    def write_all(self, collected_sites: list[CollectedSite]) -> None:
        """
        Creates or updates multiple items from the provided list of CollectedSite objects in the database
        using a single batch_write_item request.
        """

        items = [
            {
                "PutRequest": {
                    "Item": CollectedSite.to_dynamodb_item(collected_site)
                }
            }
            for collected_site in collected_sites
        ]

        self.client.batch_write_item(
            RequestItems={
                self.__TABLE_NAME : items
            }
        )