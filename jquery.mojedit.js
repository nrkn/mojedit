(function( $ ){
  rangy.init();

  var Mode = {
    move: 'move',
    edit: 'edit'
  };
  
  $.fn.mojedit = function( settings ){
    var options = $.extend( {},  $.fn.mojedit.defaults, settings );
    
    var Mojedit = function( $container ){      
      $container.addClass( 'mojedit' );
      $container.sortable();
      
      var self = this;
      self.Mode = $.extend( {}, Mode );
      
      self.$lastFocus = false;
      self.focussing = false;
      var mode = Mode.move;
      
      self.modeActions = {
        move: function(){
          mode = Mode.move;
          
          $container.removeClass( Mode.edit );      
          $container.sortable( 'enable' );
          $container.addClass( mode ); 

          options.onModeChange( mode );
        },
        edit: function(){
          mode = Mode.edit;

          $container.removeClass( Mode.move );      
          $container.sortable( 'disable' );
          $container.addClass( mode );              
          
          self.focussing = true;
          if( self.$lastFocus ) {
            self.$lastFocus.focus();
          }
          self.focussing = false;  

          options.onModeChange( mode );
        }
      };       
      
      self.mode = function( to ){
        if( !to ){
          return mode;
        }
        var result;
        $.each( Mode, function( key, value ){
          if( !result && to === value ){
            mode = result = Mode[ key ];
          }
        });
        return result;
      };
      
      self.formatters = {};
      self.$position = $( options.position );
      
      $container.append( self.$position );
      
      $.each( options.formatters, function( action, formatOptions ){
        var rangyOptions = { 
          normalize: true,
          elementTagName: action,
          applyToEditableOnly: true
        };
        if( formatOptions && formatOptions.properties ){
          rangyOptions.elementProperties = formatOptions.properties;
        }
        self.formatters[ action ] = rangy.createCssClassApplier( 'rangy-' + action, rangyOptions );      
      });
      
      if( options.createButtons ){
        var $buttonContainer;
        if( options.buttonContainer ){
          $buttonContainer = $( options.buttonContainer );
        } else {
          $buttonContainer = $( '<div></div>' );
          $container.before( $buttonContainer );
        }
        
        var $buttonGroupWrapper = $( options.buttonGroupWrapper );
        $buttonContainer.append( $buttonGroupWrapper );
        
        var $elementGroup = $( options.buttonGroup );
        $buttonGroupWrapper.append( $elementGroup );
        $elementGroup.addClass( 'element-group' );
        
        var $textGroup = $( options.buttonGroup );
        $buttonGroupWrapper.append( $textGroup );
        $textGroup.addClass( 'text-group' );
        
        var $modeGroup = $( options.buttonGroup );
        $buttonGroupWrapper.append( $modeGroup );
        $modeGroup.addClass( 'mode-group' );
        
        $.each( options.elements, function( key, value ){
          var $button = $( options.button );
          $button.html( value.html || key );
          $button.attr( 'title', value.description || key );
          $button.attr( 'data-action', key );
          
          $button.on( 'click', function(){
            self.addElement( $( this ).attr( 'data-action' ) );
            return false;
          });
          
          var $wrapper = $( options.buttonWrapper );
          $elementGroup.append( $wrapper );
          $wrapper.append( $button );
        });
        
        $.each( options.formatters, function( key, value ){
          var $button = $( options.button );
          $button.html( value.html || key );
          $button.attr( 'title', value.description || key );
          $button.attr( 'data-action', key );
          
          $button.on( 'click', function(){
            var $button = $( this );
            
            if( !$button.hasClass( 'disabled' ) ){            
              var action = $button.attr( 'data-action' );
              var properties = {};
              if( value.getProperties ){
                properties = value.getProperties();
              }
              self.formatText( action, properties );
            }
            return false;            
          });
          
          var $wrapper = $( options.buttonWrapper );
          $textGroup.append( $wrapper );
          $wrapper.append( $button );          
        });   

        $.each( options.modes, function( key, value ){
          var $button = $( options.button );
          $button.html( value.html || key );
          $button.attr( 'title', value.description || key );
          $button.attr( 'data-action', key );  

          $button.on( 'click', function(){
            self.modeActions[ $( this ).attr( 'data-action' ) ]();                    
            return false;
          });
          
          var $wrapper = $( options.buttonWrapper );
          $modeGroup.append( $wrapper );
          $wrapper.append( $button );        
        });
      }
      
      self.modeActions.move();
    };
    
    Mojedit.prototype.addElement = function( action ){
      var self = this;
      var template = options.elements[ action ];
      var $element = $( template.element );
      self.$position.after( $element );   
      $element.after( self.$position );    
      
      if( template.editable ) {
        $element.attr( 'contenteditable', true );
        $element.on( 'focus', function() {        
          if( self.focussing ) {
            return;
          }
          
          self.modeActions.edit();
        });
        $element.on( 'focusout', function() {
          self.$lastFocus = null;        
          //can't use this because if you do you can't set text :/
          //modeActions.move();
        });
        $element.on( 'dblclick', function(){
          if( self.mode() === Mode.move ) {
            self.modeActions.edit();
            self.$lastFocus = $element;
            $element.focus();
          } 
        });    
        self.$lastFocus = $element;
        $element.focus();    
      }  
      if( self.mode() === Mode.edit ) {
        self.modeActions.edit();
        $element.focus();
      }
      $( 'html, body' ).animate({
        scrollTop: self.$position.offset().top
      }, 50 );      
    };
    
    Mojedit.prototype.formatText = function( action, attributes ){
      var self = this;
      self.formatters[ action ].toggleSelection();    
      
      var properties = options.formatters[ action ];
      var $instances = $( '.rangy-' + action ).filter( function(){
        var $instance = $( this );
        var isNew = true;
        
        $.each( properties, function( key, value ){
          if( !isNew ) {
            return;
          }
          
          isNew = $instance.attr( key ) === value;
        });
        
        return isNew;
      });
      
      $instances.each( function(){
        var $instance = $( this );
        $.each( attributes, function( key, value ){
          $instance.attr( key, value );
        });
      });
    };
    
    return this.each( function(){
      var $container = $( this );
      
      if( $container.data( 'mojedit' ) === undefined ){
        var mojedit = new Mojedit( $container );
        $container.data( 'mojedit', mojedit );
      }
    });
  };
  
  $.fn.mojedit.defaults = {
    elements: {
      header: {
        element: '<h1>header</h1>',
        editable: true
      },
      text: {
        element: '<p>paragraph</p>',
        editable: true
      },
      list: {
        element: '<ul><li>list</li></ul>',
        editable: true
      },    
      numbered: {
        description: 'numbered list',
        element: '<ol><li>list</li></ol>',
        editable: true
      },
      image: {
        element: '<div class="image-container"><img src="http://placekitten.com/240/240" /></div>'
      }    
    },
    formatters: {
      strong: {},
      em: {},
      u: {},
      a: { 
        properties: {
          href: 'new:' 
        },
        getProperties: function(){
          return {
            href: window.prompt( 'url?' )
          };
        }
      }
    },
    modes: {
      move: {},
      edit: {}
    },
    position: '<span class="position">¤</span>',
    onModeChange: function(){},
    createButtons: true,    
    buttonGroupWrapper: '<div class="button-group-wrapper"></div>',
    buttonGroup: '<div class="button-group"></div>',
    buttonWrapper: '<span></span>',
    button: '<a href="#" class="button"></a>'
  };
})( jQuery );