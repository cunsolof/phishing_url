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

try:
    response = dynamodb_client.scan(TableName="CollectedSites")
    items = response.get('Items', [])

    collected_sites = []

    for item in items:
        collected_site = CollectedSite.from_dynamodb_item(item)
        collected_sites.append(to_serializable_dict(collected_site))

    with open('../public/data.json', 'w') as json_file:
        json.dump(collected_sites, json_file, indent=4)

except Exception as e:
    print("Erreur lors du scan de la table :", e)
