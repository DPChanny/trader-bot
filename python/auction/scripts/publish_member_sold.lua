-- KEYS[1]=teams_key, KEYS[2]=event_channel
-- ARGV[1]=leader_id, ARGV[2]=player_id, ARGV[3]=amount, ARGV[4]=event_type_int
local team_json = redis.call('HGET', KEYS[1], ARGV[1])
if not team_json then return end
local team = cjson.decode(team_json)
table.insert(team['member_ids'], tonumber(ARGV[2]))
team['points'] = team['points'] - tonumber(ARGV[3])
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(team))
local event = cjson.encode({
    type = tonumber(ARGV[4]),
    payload = {
        player_id = tonumber(ARGV[2]),
        leader_id = tonumber(ARGV[1]),
        amount = tonumber(ARGV[3]),
    },
})
redis.call('PUBLISH', KEYS[2], event)
