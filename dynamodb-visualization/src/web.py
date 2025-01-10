import boto3
import json
from enum import Enum
from dataclasses import asdict
from shared.models.collected_site import CollectedSite
import os

aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
region = 'eu-west-3'

def to_serializable_dict(obj):
    data = asdict(obj)
    data['source'] = obj.source.value
    return data

dynamodb_client = boto3.client(
    'dynamodb',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=region
)

table_name = "CollectedSites"
collected_sites = []
response = {}

while True:
    # Si LastEvaluatedKey existe, inclure dans la demande
    if 'LastEvaluatedKey' in response:
        response = dynamodb_client.scan(
            TableName=table_name,
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
    else:
        response = dynamodb_client.scan(TableName=table_name)

    # Traiter les éléments récupérés
    items = response.get('Items', [])
    for item in items:
        collected_site = CollectedSite.from_dynamodb_item(item)
        collected_sites.append(to_serializable_dict(collected_site))

    # Sortir de la boucle si aucune autre page n'est disponible
    if 'LastEvaluatedKey' not in response:
        break

with open('../public/data.json', 'w') as json_file:
    json.dump(collected_sites, json_file, indent=4)