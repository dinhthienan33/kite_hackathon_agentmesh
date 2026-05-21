import urllib.request, json, time, sys

url = 'https://agentmesh-225844398635.asia-southeast1.run.app/api/state'
for i in range(30):
    try:
        res = urllib.request.urlopen(url)
        data = json.loads(res.read().decode('utf-8'))
        logs = data.get('logs', [])
        if logs and logs[-1]['message'] == 'All tasks completed. Final report ready for Human Principal.':
            with open('final_state.json', 'w') as f:
                json.dump(data, f, indent=2)
            sys.exit(0)
    except Exception as e:
        pass
    time.sleep(10)
