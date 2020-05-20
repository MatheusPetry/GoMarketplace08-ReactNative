import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  loading: boolean;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (savedProducts) {
        setProducts([...JSON.parse(savedProducts)]);
      }

      setLoading(false);
    }
    loadProducts();
  }, []);

  const increment = useCallback(async id => {
    setProducts(state => {
      const productsUpdated = state.map(element =>
        element.id === id
          ? { ...element, quantity: element.quantity + 1 }
          : element,
      );
      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );
      return productsUpdated;
    });
  }, []);

  const decrement = useCallback(
    async id => {
      const filterProducts = products.filter(product => product.id !== id);

      const newProduct = products.find(product => product.id === id);

      if (newProduct && newProduct.quantity > 1) {
        setProducts(state => {
          const productsUpdated = state.map(element =>
            element.id === id
              ? { ...element, quantity: element.quantity - 1 }
              : element,
          );
          AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(productsUpdated),
          );
          return productsUpdated;
        });
      } else {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...filterProducts]),
        );
        setProducts([...filterProducts]);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }
      const newProduct = { ...product, quantity: 1 };

      setProducts(prevState => [...prevState, newProduct]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([products]),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, loading, products }),
    [products, addToCart, increment, decrement, loading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
