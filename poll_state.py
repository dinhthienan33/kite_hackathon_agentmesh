import urllib.request, json, time

url = 'https://agentmesh-225844398635.asia-southeast1.run.app/api/state'
while True:
    try:
        res = urllib.request.urlopen(url)
        data = json.loads(res.read().decode('utf-8'))
        logs = data.get('logs', [])
        if logs and logs[-1]['message'] == 'All tasks completed. Final report ready for Human Principal.':
            print(json.dumps(data, indent=2))
            break
        print(f"Waiting... current logs count: {len(logs)}")
    except Exception as e:
        print("Error", e)
    time.sleep(5)
