python3 -m venv ./backend/venv &&
source ./backend/venv/bin/activate &&
pip install -r ./backend/requirements.txt &&
echo "SECRET_KEY=$(openssl rand -hex 32)" > ./backend/.env &&
python3 -m backend.database.tables
