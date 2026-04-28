-- KEYS[1]=auction_key, KEYS[2]=event_channel
-- ARGV[1]=status_int, ARGV[2]=event_json
redis.call('HSET', KEYS[1], 'status', ARGV[1])
redis.call('PUBLISH', KEYS[2], ARGV[2])
