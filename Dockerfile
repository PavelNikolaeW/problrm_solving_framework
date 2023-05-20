FROM python:3.9

WORKDIR problem-solvig

COPY . ./

RUN pip install -r requirements.txt

ENTRYPOINT ./entrypoint.sh
