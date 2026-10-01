interface Window {
  Telegram?: {
    WebApp?: {
      initData: string;
      initDataUnsafe: unknown;
      ready: () => void;
      expand: () => void;
      openTelegramLink?: (url: string) => void;
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
    };
  };
}
