# Test it

```
sam local generate-event apigateway aws-proxy --body '{ "email": "emailhop", "message": "messagehop" }' | sam local invoke ProcessFeedbackFunction
```

# Deploy

```
npm run build && npm run package && npm run deploy
npm run build; npm run package; npm run deploy
```

# Reference

Used this project as template: https://github.com/alukach/aws-sam-typescript-boilerplate
