-- KEYS[1]=unsold_queue_key, KEYS[2]=event_channel
-- ARGV[1]=player_id, ARGV[2]=event_json
redis.call('RPUSH', KEYS[1], ARGV[1])
redis.call('PUBLISH', KEYS[2], ARGV[2])
