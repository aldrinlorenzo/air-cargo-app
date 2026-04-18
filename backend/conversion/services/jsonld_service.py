def to_json_ld(data: dict) -> dict:
    return {
        "@context": {
            "rsm": "iata:shippersdeclarationfordangerousgoods:1",
            "ram": "iata:datamodel:3"
        },
        "@type": "rsm:ShippersDeclarationForDangerousGoods",
        **data
    }