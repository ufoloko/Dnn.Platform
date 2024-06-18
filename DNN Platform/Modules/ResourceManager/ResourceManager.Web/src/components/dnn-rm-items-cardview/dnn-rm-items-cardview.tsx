import { Component, Event, EventEmitter, Host, h, Prop, Element } from '@stencil/core';
import { GetFolderContentResponse, Item } from '../../services/ItemsClient';
import state from '../../store/store';
import { selectionUtilities } from '../../utilities/selection-utilities';

@Component({
  tag: 'dnn-rm-items-cardview',
  styleUrl: 'dnn-rm-items-cardview.scss',
  shadow: true,
})
export class DnnRmItemsCardview {

  /** The list of current items. */
  @Prop() currentItems!: GetFolderContentResponse;

  @Element() el: HTMLDnnRmItemsCardviewElement;

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

  private handleContextMenu(e: MouseEvent, item: Item): void {
    e.preventDefault();
    state.selectedItems = [item];
    this.dismissContextMenu();
    const collapsible = document.createElement("dnn-collapsible");
    const contextMenu = item.isFolder
      ? document.createElement("dnn-rm-folder-context-menu")
      : document.createElement("dnn-rm-file-context-menu");
    collapsible.appendChild(contextMenu);
    contextMenu.item = item;
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
          <div class="container">
            {this.currentItems.items?.map(item =>
              <button
                class={selectionUtilities.isItemSelected(item) ? "card selected" : "card"}
                onClick={() => selectionUtilities.toggleItemSelected(item)}
                onContextMenu={e => this.handleContextMenu(e, item)}
                onDblClick={() => this.handleDoubleClick(item)}
              >
                  <img
                    src={item.thumbnailAvailable ? item.thumbnailUrl : item.iconUrl}
                    alt={`${item.itemName} (ID: ${item.itemId})`}
                  />
                  <span class="item-name">
                    {item.itemName}
                  </span>
              </button>
            )}
          </div>
        }
      </Host>
    );
  }
}
