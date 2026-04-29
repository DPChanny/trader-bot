local auction_queue = KEYS[1]
local unsold_queue = KEYS[2]
local auction_key = KEYS[3]
local event_channel = KEYS[4]
local bid_key = KEYS[5]
local event_type = tonumber(ARGV[1])

local player_id = redis.call('LPOP', auction_queue)
if not player_id then
    local unsold = redis.call('LRANGE', unsold_queue, 0, -1)
    if #unsold == 0 then
        return false
    end
    redis.call('DEL', unsold_queue)
    for _, id in ipairs(unsold) do
        redis.call('RPUSH', auction_queue, id)
    end
    redis.call('EXPIREAT', auction_queue, redis.call('EXPIRETIME', auction_key))
    player_id = redis.call('LPOP', auction_queue)
end

redis.call('HSET', auction_key, 'player_id', player_id)
redis.call('DEL', bid_key)

local event = cjson.encode({
    type = event_type,
    payload = cjson.null,
})
redis.call('PUBLISH', event_channel, event)
return player_id
