-- KEYS[1]=event_channel
-- ARGV[1]=event_json
redis.call('PUBLISH', KEYS[1], ARGV[1])
