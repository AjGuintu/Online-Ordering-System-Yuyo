import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from 'react-bootstrap'
import Rating from './Rating'
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';

const Product = ({product}) => {

    
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const addToCartHandler = async (item) => {
    const existItem = cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
  };
  
  return (
    <Card className='my-3 p-3 rounded'>
        <Link to={`/product/${product.slug}`}>
            <Card.Img src={product.image} variant='top'/>
        </Link>

        <Card.Body>
            <Link to={`/product/${product.slug}`}>
                <Card.Title as='div'><strong>{product.name}</strong></Card.Title>
            </Link>
            <Card.Text as='div'>
                <Rating 
                    value={product.rating}
                    text={`${product.numReviews} reviews `}
                />

            </Card.Text>
            <Card.Text as='h3'>₱{product.price}</Card.Text>
            {product.countInStock === 0 ? (
          <Button variant="light" disabled>
            Out of stock
          </Button>
        ) : (
          <Button onClick={() => addToCartHandler(product)}>Add to cart</Button>
        )}
        </Card.Body>
    </Card>
  )
}

export default Product