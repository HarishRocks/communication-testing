import winston from "winston";

export default winston.createLogger({
    level: 'silly',
    format: winston.format.json(),
    defaultMeta: {service: 'cli'},
});
