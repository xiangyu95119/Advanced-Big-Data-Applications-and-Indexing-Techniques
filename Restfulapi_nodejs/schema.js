const costSharesSchema = {
  "id": "/CostShares",
  "type": "object",
  "properties": {
    "deductible": {"type": "integer"},
    "_org": {"type": "string"},
    "copay": {"type": "integer"},
    "objectId": {"type": "string"},
    "objectType": {"type": "string"}
  }
};

const linkedServiceSchema = {
  "id": "/LinkedService",
  "type": "object",
  "properties": {
    "_org": {"type": "string"},
    "objectId": {"type": "string"},
    "objectType": {"type": "string"},
    "name": {"type": "string"},
  }
}

const linkedPlanServiceSchema = {
  "id": "/LinkedService",
  "type": "object",
  "properties": {
    "linkedService": {"$ref": "LinkedService"},
    "planserviceCostShares": {"$ref": "CostShares"},
    "_org": {"type": "string"},
    "objectId": {"type": "string"},
    "objectType": {"type": "string"},
  }
};

const schema = {
  "id": "/Plan",
  "type": "object",
  "properties": {
    "_org": {"type": "string"},
    "objectId": {"type": "string"},
    "objectType": {"type": "string"},
    "planType": {"type": "string"},
    "creationDate": {"type": "string"},
    "planCostShares": {"$ref": "/CostShares"},
    "linkedPlanServices": [{"$ref": "linkedPlanService"}, {"$ref": "linkedPlanService"}]
  }
};

module.exports = {
  costSharesSchema,
  linkedServiceSchema,
  linkedPlanServiceSchema,
  schema
}