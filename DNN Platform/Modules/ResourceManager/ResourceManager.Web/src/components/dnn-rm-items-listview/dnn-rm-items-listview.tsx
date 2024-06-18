import { Component, Event, EventEmitter, Host, h, Prop, Element } from '@stencil/core';
import { GetFolderContentResponse, Item } from '../../services/ItemsClient'
import state from '../../store/store';
import { selectionUtilities } from "../../utilities/selection-utilities";
import { getFileSize } from '../../utilities/filesize-utilities';
@Component({
  tag: 'dnn-rm-items-listview',
  styleUrl: 'dnn-rm-items-listview.scss',
  shadow: true,
})
export class DnnRmItemsListview {

  /** The list of current items. */
  @Prop() currentItems!: GetFolderContentResponse;

  @Element() el: HTMLDnnRmItemsListviewElement;

  /** Fires when a folder is double-clicked and emits the folder ID into the event.detail */
  @Event() dnnRmFolderDoubleClicked: EventEmitter<number>;

  /** Fires when a file is double-clicked and emits the file ID into the event.detail */
  @Event() dnnRmFileDoubleClicked: EventEmitter<string>;

  componentWillLoad() {
    document.addEventListener("click", this.dismissContextMenu.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.disconnectedCallback.bind(this));
  }

  private dismissContextMenu() {
    const existingMenus = this.el.shadowRoot.querySelectorAll("dnn-collapsible");
    existingMenus?.forEach(existingMenu => this.el.shadowRoot.removeChild(existingMenu));
  }
  

  private getLocalDateString(dateString: string) {
    const date = new Date(dateString);
    return <div class="date">
      <span>{date.toLocaleDateString()}</span>
      <span>{date.toLocaleTimeString()}</span>
    </div>
  }

  private handleRowKeyDown(e: KeyboardEvent, item: Item): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        ((e.target as HTMLTableRowElement).nextElementSibling as HTMLTableRowElement)?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        ((e.target as HTMLTableRowElement).previousElementSibling as HTMLTableRowElement)?.focus();
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        selectionUtilities.toggleItemSelected(item);
        break;
      default:
        break;
    }
  }

  private handleContextMenu(e: MouseEvent, item: Item): void {
    e.preventDefault();
    state.selectedItems = [item];
    this.dismissContextMenu();
    
    let contextMenu: HTMLDnnRmFolderContextMenuElement | HTMLDnnRmFileContextMenuElement;
    contextMenu = item.isFolder
      ? document.createElement("dnn-rm-folder-context-menu")
      : document.createElement("dnn-rm-file-context-menu");
    const collapsible = document.createElement("dnn-collapsible");
    contextMenu.item = item;
    collapsible.appendChild(contextMenu);
    collapsible.style.left = `${e.pageX}px`;
    collapsible.style.top = `${e.pageY}px`;
    collapsible.style.display = "block";
    this.el.shadowRoot.appendChild(collapsible);
    setTimeout(() => {
      collapsible.expanded = true;
    }, 100);
    return;
  }

  private handleDoubleClick(item: Item): void {
    if (item.isFolder) {
      this.dnnRmFolderDoubleClicked.emit(item.itemId);
    } else {
      this.dnnRmFileDoubleClicked.emit(item.path);
    }
  }

  render() {
    return (
      <Host>
        {this.currentItems &&
          <table>
            <thead>
              <tr>
                <td></td>
                <td>{state.localization?.Name}</td>
                <td>{state.localization?.Created}</td>
                <td>{state.localization?.LastModified}</td>
                <td>{state.localization?.Size}</td>
              </tr>
            </thead>
            <tbody>
              {this.currentItems.items?.map(item =>
                <tr
                  class={selectionUtilities.isItemSelected(item) ? "selected" : ""}
                  tabIndex={0}
                  onKeyDown={e => this.handleRowKeyDown(e, item)}
                  onClick={() => selectionUtilities.toggleItemSelected(item)}
                  onContextMenu={e => this.handleContextMenu(e, item)}
                  onDblClick={() => this.handleDoubleClick(item)}
                >
                  
                  <td><img src={item.iconUrl} /></td>
                  <td>{item.itemName}</td>
                  <td>{this.getLocalDateString(item.createdOn)}</td>
                  <td>{this.getLocalDateString(item.modifiedOn)}</td>
                  <td class="size">{getFileSize(item.fileSize)}</td>
                </tr>
              )}
            </tbody>
          </table>
        }
      </Host>
    );
  }
}
