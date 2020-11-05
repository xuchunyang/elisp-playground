FROM silex/emacs

RUN emacs --version

RUN apt-get update --quiet
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

RUN node --version

CMD bash

WORKDIR /usr/src/app
COPY package.json .
RUN npm install
EXPOSE 3000
CMD [ "npm", "start" ]
COPY . .
