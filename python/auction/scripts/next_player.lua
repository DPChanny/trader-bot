local auction_queue = KEYS[1]
local unsold_queue = KEYS[2]
local auction_key = KEYS[3]
local event_channel = KEYS[4]
local teams_key = KEYS[5]
local bid_key = KEYS[6]
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

local teams_flat = redis.call('HGETALL', teams_key)
local teams = {}
for i = 2, #teams_flat, 2 do
    table.insert(teams, cjson.decode(teams_flat[i]))
end
if #teams == 0 then teams = cjson.empty_array end

local auction_queue_ids_raw = redis.call('LRANGE', auction_queue, 0, -1)
local auction_queue_ids = {}
for _, v in ipairs(auction_queue_ids_raw) do
    table.insert(auction_queue_ids, tonumber(v))
end
if #auction_queue_ids == 0 then auction_queue_ids = cjson.empty_array end

local unsold_queue_ids_raw = redis.call('LRANGE', unsold_queue, 0, -1)
local unsold_queue_ids = {}
for _, v in ipairs(unsold_queue_ids_raw) do
    table.insert(unsold_queue_ids, tonumber(v))
end
if #unsold_queue_ids == 0 then unsold_queue_ids = cjson.empty_array end

local event = cjson.encode({
    type = event_type,
    payload = {
        player_id = tonumber(player_id),
        teams = teams,
        auction_queue = auction_queue_ids,
        unsold_queue = unsold_queue_ids,
    },
})
redis.call('PUBLISH', event_channel, event)
return player_id
