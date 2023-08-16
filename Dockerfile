FROM python:3.9
USER root

WORKDIR problem-solvig
COPY . ./

RUN pip install -r requirements.txt

RUN chmod u+x entrypoint.sh
ENTRYPOINT './entrypoint.sh'
