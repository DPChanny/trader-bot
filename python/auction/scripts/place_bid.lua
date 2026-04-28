local auction_key = KEYS[1]
local teams_key = KEYS[2]
local event_channel = KEYS[3]
local bid_key = KEYS[4]
local leader_id = ARGV[1]
local amount = tonumber(ARGV[2])
local team_size = tonumber(ARGV[3])
local event = ARGV[4]
local err_team_full = tonumber(ARGV[5])
local err_invalid_amount = tonumber(ARGV[6])

local bid_amount_raw = redis.call('HGET', bid_key, 'amount')

local team_json = redis.call('HGET', teams_key, leader_id)
if not team_json then
    return err_team_full
end

local team = cjson.decode(team_json)
local member_count = #team['member_ids']

if member_count >= team_size then
    return err_team_full
end

local remaining_slots = team_size - member_count
local max_bid = team['points'] - (remaining_slots - 1)
if amount > max_bid then
    return err_invalid_amount
end

local current_bid = tonumber(bid_amount_raw) or 0
if amount < current_bid + 1 then
    return err_invalid_amount
end

redis.call('HSET', bid_key, 'amount', ARGV[2], 'leader_id', leader_id)
redis.call('EXPIREAT', bid_key, redis.call('EXPIRETIME', auction_key))
redis.call('PUBLISH', event_channel, event)
return 0
