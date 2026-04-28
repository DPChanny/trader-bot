-- KEYS[1]=auction_queue, KEYS[2]=unsold_queue, KEYS[3]=auction_key, KEYS[4]=event_channel, KEYS[5]=teams_key
-- ARGV[1]=event_type_int
-- Returns player_id string if next player exists, false if auction is complete
local player_id = redis.call('LPOP', KEYS[1])
if not player_id then
    local unsold = redis.call('LRANGE', KEYS[2], 0, -1)
    if #unsold == 0 then
        return false
    end
    redis.call('DEL', KEYS[2])
    for _, id in ipairs(unsold) do
        redis.call('RPUSH', KEYS[1], id)
    end
    player_id = redis.call('LPOP', KEYS[1])
end

redis.call('HSET', KEYS[3], 'player_id', player_id, 'bid_amount', '', 'bid_leader_id', '')

local teams_raw = redis.call('HGETALL', KEYS[5])
local teams = {}
for i = 2, #teams_raw, 2 do
    table.insert(teams, cjson.decode(teams_raw[i]))
end
if #teams == 0 then teams = cjson.empty_array end

local aq_raw = redis.call('LRANGE', KEYS[1], 0, -1)
local aq = {}
for _, v in ipairs(aq_raw) do
    table.insert(aq, tonumber(v))
end
if #aq == 0 then aq = cjson.empty_array end

local uq_raw = redis.call('LRANGE', KEYS[2], 0, -1)
local uq = {}
for _, v in ipairs(uq_raw) do
    table.insert(uq, tonumber(v))
end
if #uq == 0 then uq = cjson.empty_array end

local event = cjson.encode({
    type = tonumber(ARGV[1]),
    payload = {
        player_id = tonumber(player_id),
        teams = teams,
        auction_queue = aq,
        unsold_queue = uq,
    },
})
redis.call('PUBLISH', KEYS[4], event)
return player_id
