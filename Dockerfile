FROM silex/emacs

RUN apt-get update --quiet
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 3000
RUN npm install pm2 -g
CMD [ "pm2-runtime", "npm", "--", "start" ]
