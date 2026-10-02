#!/bin/bash
# Instala y arranca la API en una instancia EC2 con Amazon Linux 2023.
# Uso: bash deploy/ec2-setup.sh   (desde la raíz del repositorio clonado en /home/ec2-user)
set -e

sudo dnf install -y python3.11 python3.11-pip git

cd ~/plataforma-videos/backend
python3.11 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo ">> Edita backend/.env con los datos de RDS y S3 y vuelve a ejecutar este script."
  exit 1
fi

sudo cp ../deploy/videoapi.service /etc/systemd/system/videoapi.service
sudo systemctl daemon-reload
sudo systemctl enable --now videoapi
sudo systemctl restart videoapi
sleep 2
sudo systemctl status videoapi --no-pager
echo ">> API lista en http://$(curl -s http://checkip.amazonaws.com):8000/docs"
