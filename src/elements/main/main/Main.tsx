import { memo } from 'react';
import SelectMenu from '../select_menu/SelectMenu';
import LotList from '../lot_list/LotList';
import mainS from './main.module.scss';

function Main() {
  return (
    <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <SelectMenu />
      <LotList />
    </main>
  );
}

export default memo(Main);
