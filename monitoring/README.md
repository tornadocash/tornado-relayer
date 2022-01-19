# Installing the Zabbix server

Change default passwords, ports and set listen IP (ports `8080/tcp` and `10051/tcp` will be open on all interfaces, use a firewall or specify the address of the required interface), then run:

```bash
wget https://github.com/tornadocash/tornado-relayer/raw/master/monitoring/zabbix.tar.gz
mkdir $HOME/monitoring/
tar -xzf zabbix.tar.gz -C $HOME/monitoring/
cd $HOME/monitoring/
docker-compose up -d
```

# Installing the Zabbix agent

Download package from repository [https://repo.zabbix.com/zabbix/5.2/ubuntu/pool/main/z/zabbix/](https://repo.zabbix.com/zabbix/5.2/ubuntu/pool/main/z/zabbix/) and run:

```bash
sudo dpkg -i zabbix-agent_5.2.*.deb
sudo usermod -aG docker zabbix
```

Change default values in `/etc/zabbix/zabbix_agent2.conf`:

- `Hostname` the same as in the zabbix-server web interface;
- `Server` and `ServerActive` set zabbix server IP or DNS name;
- `ListenIP` to local network IP available from zabbix server or set firewall rules to restrict access to port `10050`;
- uncomment `Plugins.Docker.Endpoint=unix:///var/run/docker.sock`.

Then run:

```bash
sudo systemctl enable zabbix-agent2.service
sudo systemctl restart zabbix-agent2.service
```

# Adding the host

Log into your Zabbix server (defaul login and passord: `Admin` - `zabbix`) and click on the Configuration tab and then the Hosts tab. Click the Create host button near the top right corner. In the resulting page, change the Host name and IP ADDRESS sections to match the information for your remote server. Set `{$URL}` macros to relayer host, example `http://localhost/v1/status` or `https://domain.name/v1/status`.

# Import templates

Import templates using the WebUI:

- [Docker-template.yaml](/monitoring/templates/Docker-template.yaml);
- [Tornado-relayer-template.yaml](/monitoring/templates/Tornado-relayer-template.yaml).

Link templates with added host. It is also recommended to link `Linux CPU by Zabbix agent`, `Linux filesystems by Zabbix agent` and `Linux memory by Zabbix agent` templates to the host.

# Alerts

In WebUI - Administration -> Media types -> Telegram:

```
https://git.zabbix.com/projects/ZBX/repos/zabbix/browse/templates/media/telegram

1. Register bot: send "/newbot" to @BotFather and follow instructions
2. Copy and paste the obtained token into the "Token" field above
3. If you want to send personal notifications, you need to get chat id of the user you want to send messages to:
    3.1. Send "/getid" to "@myidbot" in Telegram messenger
    3.2. Copy returned chat id and save it in the "Telegram Webhook" media for the user
    3.3. Ask the user to send "/start" to your bot (Telegram bot won't send anything to the user without it)
4. If you want to send group notifications, you need to get group id of the group you want to send messages to:
    4.1. Add "@myidbot" to your group
    4.2. Send "/getgroupid@myidbot" in your group
    4.3. Copy returned group id save it in the "Telegram Webhook" media for the user you created for  group notifications
    4.4. Send "/start@your_bot_name_here" in your group (Telegram bot won't send anything to the group without it)
```
