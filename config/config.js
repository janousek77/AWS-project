module.exports = {
  aws_table_name: 'lastName',
  aws_local_config: {
    region: 'us-west-1',
    endpoint: 'http://localhost:8080'
  },
  aws_remote_config: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-west-1',
  }
};
