-- KEYS[1]=auction_key, KEYS[2]=teams_key, KEYS[3]=event_channel
-- ARGV[1]=leader_id, ARGV[2]=amount, ARGV[3]=team_size, ARGV[4]=event_json
-- ARGV[5]=ERR_INVALID_STATE, ARGV[6]=ERR_TEAM_FULL, ARGV[7]=ERR_INVALID_AMOUNT
-- Returns 0 on success, error_code on failure
local state = redis.call('HMGET', KEYS[1], 'status', 'player_id', 'bid_amount')
local status = state[1]
local player_id = state[2]
local bid_amount_str = state[3]

if status ~= '2' or not player_id or player_id == '' then
    return tonumber(ARGV[5])
end

local amount = tonumber(ARGV[2])
local team_size = tonumber(ARGV[3])

local team_json_str = redis.call('HGET', KEYS[2], ARGV[1])
if not team_json_str then
    return tonumber(ARGV[5])
end

local team = cjson.decode(team_json_str)
local member_count = #team['member_ids']

if member_count >= team_size then
    return tonumber(ARGV[6])
end

local remaining_slots = team_size - member_count
local max_bid = team['points'] - (remaining_slots - 1)
if amount > max_bid then
    return tonumber(ARGV[7])
end

local current_bid = 0
if bid_amount_str and bid_amount_str ~= '' then
    current_bid = tonumber(bid_amount_str)
end
if amount < current_bid + 1 then
    return tonumber(ARGV[7])
end

redis.call('HSET', KEYS[1], 'bid_amount', ARGV[2], 'bid_leader_id', ARGV[1])
redis.call('PUBLISH', KEYS[3], ARGV[4])
return 0
