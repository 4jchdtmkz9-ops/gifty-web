interface Window {
  Telegram?: {
    WebApp?: {
      initData: string;
      initDataUnsafe: unknown;
      ready: () => void;
      expand: () => void;
      openTelegramLink?: (url: string) => void;
      openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
    };
  };
}
