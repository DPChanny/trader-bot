local teams_key = KEYS[1]
local event_channel = KEYS[2]
local auction_key = KEYS[3]
local bid_key = KEYS[4]
local leader_id = ARGV[1]
local player_id = tonumber(ARGV[2])
local amount = tonumber(ARGV[3])
local event_type = tonumber(ARGV[4])

local team_json = redis.call('HGET', teams_key, leader_id)
if not team_json then return end
local team = cjson.decode(team_json)
table.insert(team['member_ids'], player_id)
team['points'] = team['points'] - amount
redis.call('HSET', teams_key, leader_id, cjson.encode(team))
redis.call('HSET', auction_key, 'player_id', '')
redis.call('DEL', bid_key)
local event = cjson.encode({
    type = event_type,
    payload = cjson.null,
})
redis.call('PUBLISH', event_channel, event)
