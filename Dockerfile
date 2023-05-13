FROM python:3.9

WORKDIR problem-solvig

COPY . ./

RUN pip install -r requirements.txt
RUN pip install django djangorestframework


ENTRYPOINT ./entrypoint.sh
