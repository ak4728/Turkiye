#!/usr/bin/env bash
set -uo pipefail

echo '== service =='
systemctl is-active postgresql 2>/dev/null || systemctl list-units --type=service | grep -i postgres

echo '== config files =='
sudo -u postgres psql -tAc 'SHOW config_file'
sudo -u postgres psql -tAc 'SHOW hba_file'

echo '== listen_addresses =='
sudo -u postgres psql -tAc 'SHOW listen_addresses'

echo '== port =='
sudo -u postgres psql -tAc 'SHOW port'

echo '== databases =='
sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname='travelsite'"

echo '== roles =='
sudo -u postgres psql -tAc "SELECT rolname FROM pg_roles WHERE rolname='travelsite_user'"

echo '== firewall =='
if firewall-cmd --state 2>/dev/null; then
  firewall-cmd --list-all 2>/dev/null
else
  echo 'firewalld not running'
fi

echo '== listening on 5432 =='
ss -tlnp 2>/dev/null | grep 5432 || echo 'nothing on 5432'
