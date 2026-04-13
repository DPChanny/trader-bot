from . import BaseDTO, NameStr, NullableUrlStr


class PositionDTO(BaseDTO):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None


class AddPositionDTO(BaseDTO):
    name: NameStr
    icon_url: NullableUrlStr


class UpdatePositionDTO(BaseDTO):
    name: NameStr | None = None
    icon_url: NullableUrlStr = None
