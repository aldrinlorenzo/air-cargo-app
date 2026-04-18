import xmltodict


def parse_xml(file_bytes: bytes) -> dict:
    return xmltodict.parse(
        file_bytes,
        attr_prefix="@",
        cdata_key="@value",
        dict_constructor=dict
    )