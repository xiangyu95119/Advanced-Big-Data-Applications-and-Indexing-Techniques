const express = require('express')
const Validator = require('jsonschema').Validator;
const redis = require('redis');
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const schema = require("./schema.js");
const jwt = require('jsonwebtoken');
const etag = require('etag');

const PORT = process.env.PORT || 3333;

const app = express();
const v  = new Validator();
const client = redis.createClient("6379", "127.0.0.1");

const createObj = async (body, client, req, res) => {
    const ids = [];
    const newObj = Object.assign({}, body);
    newObj["planCostShares"] = newObj["planCostShares"].objectId;
    newObj["linkedPlanServices"] = [newObj["linkedPlanServices"][0].objectId, newObj["linkedPlanServices"][1].objectId];

    ids.push(newObj.objectId);
    await client.set(newObj.objectId, JSON.stringify(newObj), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }

        console.log(newObj.objectId);

    });

    ids.push(body["planCostShares"].objectId);
    await client.set(body["planCostShares"].objectId, JSON.stringify(body["planCostShares"]), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(body["planCostShares"].objectId);

    });

    let newObj1 = Object.assign({}, body["linkedPlanServices"][0]);
    newObj1["linkedService"] = newObj1["linkedService"].objectId;
    newObj1["planserviceCostShares"] = newObj1["planserviceCostShares"].objectId;
    ids.push(newObj1.objectId);
    await client.set(newObj1.objectId, JSON.stringify(newObj1), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(newObj1.objectId);
    });

    let newObj2 = Object.assign({}, body["linkedPlanServices"][1]);
    newObj2["linkedService"] = newObj2["linkedService"].objectId;
    newObj2["planserviceCostShares"] = newObj2["planserviceCostShares"].objectId;
    ids.push(newObj2.objectId);
    await client.set(newObj2.objectId, JSON.stringify(newObj2), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(newObj2.objectId);
    });

    newObj1 = Object.assign({}, body["linkedPlanServices"][0]);
    ids.push(newObj1["linkedService"].objectId);
    await client.set(newObj1["linkedService"].objectId, JSON.stringify(newObj1["linkedService"]), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(newObj1["linkedService"].objectId);
    });
    ids.push(newObj1["planserviceCostShares"].objectId);
    await client.set(newObj1["planserviceCostShares"].objectId, JSON.stringify(newObj1["planserviceCostShares"]), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(newObj1["planserviceCostShares"].objectId);
    });

    newObj2 = Object.assign({}, body["linkedPlanServices"][1]);
    ids.push(newObj2["linkedService"].objectId);
    await client.set(newObj2["linkedService"].objectId, JSON.stringify(newObj2["linkedService"]), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
        console.log(newObj2["linkedService"].objectId);
    });

    ids.push(newObj2["planserviceCostShares"].objectId);
    await client.set(newObj2["planserviceCostShares"].objectId, JSON.stringify(newObj2["planserviceCostShares"]), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }

        console.log(newObj2["planserviceCostShares"].objectId);
    });

    await client.set(req.user, JSON.stringify(ids), async (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 400});
            return;
        }
    });


}

const deleteObject = async (index, ids, body, client, req, res, isDelete) => {
    if (index == ids.length) {
        if (isDelete) {
            res.send("Successfully delete the element");
        } else {
            await createObj(body, client, req, res);
            res.send("Successfully update the element");
        }
        return;
    }

    await client.del(ids[index], async (err, reply) => {
        if (err) {
            console.log(err);
            res.status(500).json({success: false, error: err, statusCode: 500});
            return;
        }

        await deleteObject(index + 1, ids, body, client, req, res, isDelete);
    });
}

app.enable('etag');
app.use( bodyParser.json({ extended: true, type: '*/*' }) );
app.use((req, res, next) => {
    if (req.headers && req.headers.authorization) {
        jwt.verify(req.headers.authorization, 'RESTFULAPIS', (err, decode) => {
            if (err) {
                res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
                return;
            }

            console.log(decode);
            req.user = decode.username;
            next();
        });
    } else {
        req.user = undefined;
        next();
    }
});

v.addSchema(schema.costSharesSchema, '/CostShares');
v.addSchema(schema.linkedServiceSchema, '/LinkedService');
v.addSchema(schema.linkedPlanServiceSchema, '/LinkedService');

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    client.select(1, () => {
        client.set(username, bcrypt.hashSync(password, 10), (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false,statusCode: 400});
                return;
            }

            res.send(JSON.stringify(reply));
        });
    });
});

app.post("/signIn", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    client.select(1, () => {
        client.get(username, (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false, error: err, statusCode: 400});
                return;
            }

            if (reply == null) {
                res.status(401).json({success: false, error: "User doesn't exist in the database", statusCode: 401})
            } else {
                if (bcrypt.compareSync(password, reply)) {
                    const expiration = Math.floor(Date.now() / 1000) + (60 * 60)
                    res.json({token: jwt.sign({username: username, exp: expiration}, 'RESTFULAPIS'), message: "Successfully", expiration: new Date(Date.now() + (60 * 60))});
                } else {
                    res.status(401).json({success: false, error: "Wrong Account", statusCode: 401})
                }
            }
        });
    });
});

app.get("/getPlan", async (req, res) => {
    if (!req.user) {
        res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
        return;
    }

    await client.select(0, async () => {
        let ids = [];
        client.get(req.user, async (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false,statusCode: 500});
                return;
            }

            ids = JSON.parse(reply);
            let obj = {};
            client.get(ids[0], (err, reply) => {
                obj = JSON.parse(reply);
                client.get(ids[1], (err, reply) => {
                    obj["planCostShares"] = JSON.parse(reply);
                    client.get(ids[2], (err, reply) => {
                        obj["linkedPlanServices"][0] = JSON.parse(reply);
                        client.get(ids[3], (err, reply) => {
                            obj["linkedPlanServices"][1] = JSON.parse(reply);
                            client.get(ids[4], (err, reply) => {
                                obj["linkedPlanServices"][0]["linkedService"] = JSON.parse(reply);
                                client.get(ids[5], (err, reply) => {
                                    obj["linkedPlanServices"][0]["planserviceCostShares"] = JSON.parse(reply);
                                    client.get(ids[6], (err, reply) => {
                                        obj["linkedPlanServices"][1]["linkedService"] = JSON.parse(reply);
                                        client.get(ids[7], (err, reply) => {
                                            obj["linkedPlanServices"][1]["planserviceCostShares"] = JSON.parse(reply);
                                            res.send(obj);
                                        });
                                    });
                                });
                            });
                        });
                    });

                });
            });
        });
    });
})

app.post("/createPlan", async (req, res) => {
    if (!req.user) {
        res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
        return;
    }

    const body = req.body;

    if (!v.validate(body, schema.schema).valid) {
        res.status(400).json({success: false, error: "Validation Error", statusCode: 400});
        return;
    }

    await client.select(0, async () => {
        await client.get(req.user, async (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false, error: err, statusCode: 400});
                return;
            }

            if (reply != null) {
                res.send(JSON.stringify({success: false, error: "The objectId already exists"}));
            } else {
                await createObj(body, client, req, res);
                res.send("Successfully created");
            }
        });
    });

})

app.put("/updatePlan", async (req, res) => {
    if (!req.user) {
        res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
        return;
    }

    res.setHeader('ETag', etag(JSON.stringify(req.body)));
    if (req.headers["if-none-match"] == etag(JSON.stringify(req.body))) {
        res.status(304).json("Body Not Modified");
        return;
    }

    await client.select(0, async () => {
        await client.get(req.user, async (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false, error: err, statusCode: 400});
                return;
            }

            if (reply == null) {
                res.send(JSON.stringify({success: false, error: "The objectId doesn't exist"}));
            } else {
                const ids = JSON.parse(reply);
                console.log(ids);
                await client.del(req.user, async (err, reply) => {
                    await deleteObject(0, ids, req.body, client, req, res, false);
                });
            }
        });
    });
});

app.patch("/updatePartPlan", async (req, res) => {
    if (!req.user) {
        res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
        return;
    }

    res.setHeader('ETag', etag(JSON.stringify(req.body)));
    if (req.headers["if-none-match"] == etag(JSON.stringify(req.body))) {
        res.status(304).json("Body Not Modified");
        return;
    }

    await client.select(0, async () => {
        await client.get(req.user, async (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false, error: err, statusCode: 400});
                return;
            }

            if (reply == null) {
                res.send(JSON.stringify({success: false, error: "The objectId doesn't exist"}));
            } else {
                const ids = JSON.parse(reply);
                console.log(ids);
                await client.del(req.user, async (err, reply) => {
                    await deleteObject(0, ids, req.body, client, req, res, false);
                });
            }
        });
    });
});

app.delete("/deletePlan", async (req, res) => {
    if (!req.user) {
        res.status(401).json({success: false, error: "Unauthorized", statusCode: 401});
        return;
    }

    await client.select(0, async () => {
        await client.get(req.user, async (err, reply) => {
            if (err) {
                console.log(err);
                res.status(500).json({success: false, error: err, statusCode: 400});
                return;
            }

            if (reply == null) {
                res.send(JSON.stringify({success: false, error: "The objectId doesn't exist"}));
            } else {
                const ids = JSON.parse(reply);
                console.log(ids);
                await client.del(req.user, async (err, reply) => {
                    await deleteObject(0, ids, req.body, client, req, res, true);
                });
            }
        });
    });

})

app.listen(PORT, () => {
    console.log("App listening at :" + PORT);
});







