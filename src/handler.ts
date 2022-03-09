import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from 'aws-sdk'
import { v4 } from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient()
const tableName = "Products Table";

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const reqBody = JSON.parse(event.body as string);

  const product = {
    ...reqBody,
    productID: v4(),
  }

  await docClient.put({
    TableName: tableName,
    Item: product,
  })
  .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(product),
  };
};

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
  }
}
const fetchProductById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        productID: id
      }
    })
    .promise()

  if (!output.Item) {
    throw new HttpError(404, { error: "not found" })
  }
  return output.Item;
}

const handleError = (e: unknown) => {
  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      body: e.message,
    }
  }
  throw e
}
export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const product = await fetchProductById(event.pathParameters?.id as string);

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;
    await fetchProductById(id);

    const reqBody = JSON.parse(event.body as string);

    const product = {
      ...reqBody,
      productID: id,
    }

    await docClient
      .put({
        TableName: tableName,
        Item: product,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return handleError(e);
  }
}
export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchProductById(id);

    await docClient
      .delete({
        TableName: tableName,
        Key: {
          productID: id,
        },
      })
      .promise();
      return {
        statusCode: 204,
        body: "",
      }
  } catch (e) {
    return handleError(e);
  }
};
export const listProduct = async (even: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const output = await docClient.scan({
    TableName: tableName,
  })
  .promise();
  return {
    statusCode: 200,
    body: JSON.stringify(output.Items)
  };
};

