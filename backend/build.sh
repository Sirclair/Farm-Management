pip install -r requirements.txt && \
python manage.py makemigrations inventory && \
python manage.py migrate && \
python manage.py collectstatic --noinput