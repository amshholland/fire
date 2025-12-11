import { useEffect, useState } from 'react';
import { fetchItems, createItem } from '../api/itemsApi.ts';

interface Item {
    id: number;
    name: string;
    created_at: string;
}

const useItems = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadItems = async () => {
            try {
                const fetchedItems = await fetchItems();
                setItems(fetchedItems);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, []);

    const addItem = async (name: any) => {
        try {
            const newItem = await createItem({ name });
            setItems((prevItems) => [...prevItems, newItem]);
        } catch (err) {
            setError(err as Error);
        }
    };

    return { items, loading, error, addItem };
};

export default useItems;