-- KEYS[1]=auction_key, KEYS[2]=event_channel
-- ARGV[1]=increment (+1 or -1), ARGV[2]=event_type_int, ARGV[3]=leader_id
-- Returns new connected_leader_count
local count = redis.call('HINCRBY', KEYS[1], 'connected_leader_count', ARGV[1])
local event = cjson.encode({
    type = tonumber(ARGV[2]),
    payload = {
        leader_id = tonumber(ARGV[3]),
        connected_leader_count = count,
    },
})
redis.call('PUBLISH', KEYS[2], event)
return count
