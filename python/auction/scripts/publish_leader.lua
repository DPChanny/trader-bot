local auction_key = KEYS[1]
local event_channel = KEYS[2]
local increment = ARGV[1]
local event_type = tonumber(ARGV[2])
local leader_id = tonumber(ARGV[3])

local count = redis.call('HINCRBY', auction_key, 'connected_leader_count', increment)
local event = cjson.encode({
    type = event_type,
    payload = {
        leader_id = leader_id,
        connected_leader_count = count,
    },
})
redis.call('PUBLISH', event_channel, event)
return count
